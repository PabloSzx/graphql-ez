import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql';

import { CommonSchema, startFastifyServer } from 'graphql-ez-testing';

import { ezScalars } from '../src';

test('all scalars', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezScalars('*')],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    "\\"\\"\\"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @defer(
      \\"\\"\\"Deferred when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    \\"\\"\\"
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @stream(
      \\"\\"\\"Stream when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String

      \\"\\"\\"Number of items to return immediately\\"\\"\\"
      initialCount: Int = 0
    ) on FIELD

    \\"\\"\\"
    A date string, such as 2007-12-03, compliant with the \`full-date\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
    \\"\\"\\"
    scalar Date

    \\"\\"\\"
    A time string at UTC, such as 10:15:30Z, compliant with the \`full-time\` format outlined in section 5.6 of the RFC 3339profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
    \\"\\"\\"
    scalar Time

    \\"\\"\\"
    A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
    \\"\\"\\"
    scalar DateTime

    \\"\\"\\"
    The javascript \`Date\` as integer. Type represents date and time as number of milliseconds from start of UNIX epoch.
    \\"\\"\\"
    scalar Timestamp

    \\"\\"\\"
    A field whose value is a UTC Offset: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    \\"\\"\\"
    scalar UtcOffset

    \\"\\\\n    A string representing a duration conforming to the ISO8601 standard,\\\\n    such as: P1W1DT13H23M34S\\\\n    P is the duration designator (for period) placed at the start of the duration representation.\\\\n    Y is the year designator that follows the value for the number of years.\\\\n    M is the month designator that follows the value for the number of months.\\\\n    W is the week designator that follows the value for the number of weeks.\\\\n    D is the day designator that follows the value for the number of days.\\\\n    T is the time designator that precedes the time components of the representation.\\\\n    H is the hour designator that follows the value for the number of hours.\\\\n    M is the minute designator that follows the value for the number of minutes.\\\\n    S is the second designator that follows the value for the number of seconds.\\\\n\\\\n    Note the time designator, T, that precedes the time value.\\\\n\\\\n    Matches moment.js, Luxon and DateFns implementations\\\\n    ,/. is valid for decimal places and +/- is a valid prefix\\\\n  \\"
    scalar Duration

    \\"\\\\n    A string representing a duration conforming to the ISO8601 standard,\\\\n    such as: P1W1DT13H23M34S\\\\n    P is the duration designator (for period) placed at the start of the duration representation.\\\\n    Y is the year designator that follows the value for the number of years.\\\\n    M is the month designator that follows the value for the number of months.\\\\n    W is the week designator that follows the value for the number of weeks.\\\\n    D is the day designator that follows the value for the number of days.\\\\n    T is the time designator that precedes the time components of the representation.\\\\n    H is the hour designator that follows the value for the number of hours.\\\\n    M is the minute designator that follows the value for the number of minutes.\\\\n    S is the second designator that follows the value for the number of seconds.\\\\n\\\\n    Note the time designator, T, that precedes the time value.\\\\n\\\\n    Matches moment.js, Luxon and DateFns implementations\\\\n    ,/. is valid for decimal places and +/- is a valid prefix\\\\n  \\"
    scalar ISO8601Duration

    \\"\\"\\"
    A local date string (i.e., with no associated timezone) in \`YYYY-MM-DD\` format, e.g. \`2020-01-01\`.
    \\"\\"\\"
    scalar LocalDate

    \\"\\"\\"
    A local time string (i.e., with no associated timezone) in 24-hr \`HH:mm[:ss[.SSS]]\` format, e.g. \`14:25\` or \`14:25:06\` or \`14:25:06.123\`.
    \\"\\"\\"
    scalar LocalTime

    \\"\\"\\"
    A local time string (i.e., with no associated timezone) in 24-hr \`HH:mm[:ss[.SSS]]\` format, e.g. \`14:25\` or \`14:25:06\` or \`14:25:06.123\`.  This scalar is very similar to the \`LocalTime\`, with the only difference being that \`LocalEndTime\` also allows \`24:00\` as a valid value to indicate midnight of the following day.  This is useful when using the scalar to represent the exclusive upper bound of a time block.
    \\"\\"\\"
    scalar LocalEndTime

    \\"\\"\\"
    A field whose value conforms to the standard internet email address format as specified in RFC822: https://www.w3.org/Protocols/rfc822/.
    \\"\\"\\"
    scalar EmailAddress

    \\"\\"\\"Floats that will have a value less than 0.\\"\\"\\"
    scalar NegativeFloat

    \\"\\"\\"Integers that will have a value less than 0.\\"\\"\\"
    scalar NegativeInt

    \\"\\"\\"A string that cannot be passed as an empty value\\"\\"\\"
    scalar NonEmptyString

    \\"\\"\\"Floats that will have a value of 0 or more.\\"\\"\\"
    scalar NonNegativeFloat

    \\"\\"\\"Integers that will have a value of 0 or more.\\"\\"\\"
    scalar NonNegativeInt

    \\"\\"\\"Floats that will have a value of 0 or less.\\"\\"\\"
    scalar NonPositiveFloat

    \\"\\"\\"Integers that will have a value of 0 or less.\\"\\"\\"
    scalar NonPositiveInt

    \\"\\"\\"
    A field whose value conforms to the standard E.164 format as specified in: https://en.wikipedia.org/wiki/E.164. Basically this is +17895551234.
    \\"\\"\\"
    scalar PhoneNumber

    \\"\\"\\"Floats that will have a value greater than 0.\\"\\"\\"
    scalar PositiveFloat

    \\"\\"\\"Integers that will have a value greater than 0.\\"\\"\\"
    scalar PositiveInt

    \\"\\"\\"
    A field whose value conforms to the standard postal code formats for United States, United Kingdom, Germany, Canada, France, Italy, Australia, Netherlands, Spain, Denmark, Sweden, Belgium, India, Austria, Portugal, Switzerland or Luxembourg.
    \\"\\"\\"
    scalar PostalCode

    \\"\\"\\"Floats that will have a value of 0 or more.\\"\\"\\"
    scalar UnsignedFloat

    \\"\\"\\"Integers that will have a value of 0 or more.\\"\\"\\"
    scalar UnsignedInt

    \\"\\"\\"
    A field whose value conforms to the standard URL format as specified in RFC3986: https://www.ietf.org/rfc/rfc3986.txt.
    \\"\\"\\"
    scalar URL

    \\"\\"\\"
    The \`BigInt\` scalar type represents non-fractional signed whole numeric values.
    \\"\\"\\"
    scalar BigInt

    \\"\\"\\"
    The \`BigInt\` scalar type represents non-fractional signed whole numeric values.
    \\"\\"\\"
    scalar Long

    \\"\\"\\"The \`Byte\` scalar type represents byte value as a Buffer\\"\\"\\"
    scalar Byte

    \\"\\"\\"
    A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier.
    \\"\\"\\"
    scalar UUID

    \\"\\"\\"
    A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier.
    \\"\\"\\"
    scalar GUID

    \\"\\"\\"
    A field whose value is a hexadecimal: https://en.wikipedia.org/wiki/Hexadecimal.
    \\"\\"\\"
    scalar Hexadecimal

    \\"\\"\\"
    A field whose value is a hex color code: https://en.wikipedia.org/wiki/Web_colors.
    \\"\\"\\"
    scalar HexColorCode

    \\"\\"\\"
    A field whose value is a CSS HSL color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla().
    \\"\\"\\"
    scalar HSL

    \\"\\"\\"
    A field whose value is a CSS HSLA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#hsl()_and_hsla().
    \\"\\"\\"
    scalar HSLA

    \\"\\"\\"
    A field whose value is a IPv4 address: https://en.wikipedia.org/wiki/IPv4.
    \\"\\"\\"
    scalar IPv4

    \\"\\"\\"
    A field whose value is a IPv6 address: https://en.wikipedia.org/wiki/IPv6.
    \\"\\"\\"
    scalar IPv6

    \\"\\"\\"
    A field whose value is a ISBN-10 or ISBN-13 number: https://en.wikipedia.org/wiki/International_Standard_Book_Number.
    \\"\\"\\"
    scalar ISBN

    \\"\\"\\"
    A field whose value is a JSON Web Token (JWT): https://jwt.io/introduction.
    \\"\\"\\"
    scalar JWT

    \\"\\"\\"
    A field whose value is a valid decimal degrees latitude number (53.471): https://en.wikipedia.org/wiki/Latitude
    \\"\\"\\"
    scalar Latitude

    \\"\\"\\"
    A field whose value is a valid decimal degrees longitude number (53.471): https://en.wikipedia.org/wiki/Longitude
    \\"\\"\\"
    scalar Longitude

    \\"\\"\\"
    A field whose value is a IEEE 802 48-bit MAC address: https://en.wikipedia.org/wiki/MAC_address.
    \\"\\"\\"
    scalar MAC

    \\"\\"\\"
    A field whose value is a valid TCP port within the range of 0 to 65535: https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_ports
    \\"\\"\\"
    scalar Port

    \\"\\"\\"
    A field whose value is a CSS RGB color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba().
    \\"\\"\\"
    scalar RGB

    \\"\\"\\"
    A field whose value is a CSS RGBA color: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#rgb()_and_rgba().
    \\"\\"\\"
    scalar RGBA

    \\"\\"\\"
    The \`SafeInt\` scalar type represents non-fractional signed whole numeric values that are considered safe as defined by the ECMAScript specification.
    \\"\\"\\"
    scalar SafeInt

    \\"\\"\\"A currency string, such as $21.25\\"\\"\\"
    scalar USCurrency

    \\"\\"\\"
    A field whose value is a Currency: https://en.wikipedia.org/wiki/ISO_4217.
    \\"\\"\\"
    scalar Currency

    \\"\\"\\"
    The \`JSON\` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
    \\"\\"\\"
    scalar JSON

    \\"\\"\\"
    The \`JSONObject\` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
    \\"\\"\\"
    scalar JSONObject

    \\"\\"\\"
    A field whose value is an International Bank Account Number (IBAN): https://en.wikipedia.org/wiki/International_Bank_Account_Number.
    \\"\\"\\"
    scalar IBAN

    \\"\\"\\"
    A field whose value conforms with the standard mongodb object ID as described here: https://docs.mongodb.com/manual/reference/method/ObjectId/#ObjectId. Example: 5e5677d71bdc2ae76344968c
    \\"\\"\\"
    scalar ObjectID

    \\"\\"\\"Represents NULL values\\"\\"\\"
    scalar Void

    \\"\\"\\"
    A field whose value conforms to the standard DID format as specified in did-core: https://www.w3.org/TR/did-core/.
    \\"\\"\\"
    scalar DID

    \\"\\"\\"A country code as defined by ISO 3166-1 alpha-2\\"\\"\\"
    scalar CountryCode

    \\"\\"\\"The locale in the format of a BCP 47 (RFC 5646) standard string\\"\\"\\"
    scalar Locale

    \\"\\"\\"
    In the US, an ABA routing transit number (\`ABA RTN\`) is a nine-digit code to identify the financial institution.
    \\"\\"\\"
    scalar RoutingNumber

    \\"\\"\\"
    Banking account number is a string of 5 to 17 alphanumeric values for representing an generic account number
    \\"\\"\\"
    scalar AccountNumber

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);
});

test('scalars in list', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [ezScalars(['Currency'])],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    "\\"\\"\\"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @defer(
      \\"\\"\\"Deferred when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    \\"\\"\\"
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @stream(
      \\"\\"\\"Stream when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String

      \\"\\"\\"Number of items to return immediately\\"\\"\\"
      initialCount: Int = 0
    ) on FIELD

    \\"\\"\\"
    A field whose value is a Currency: https://en.wikipedia.org/wiki/ISO_4217.
    \\"\\"\\"
    scalar Currency

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);
});

test('scalars in object', async () => {
  const { query } = await startFastifyServer({
    createOptions: {
      ez: {
        plugins: [
          ezScalars({
            DateTime: 1,
            Date: 0,
          }),
        ],
      },
      schema: [CommonSchema.schema],
    },
  });

  expect(printSchema(buildClientSchema((await query<IntrospectionQuery>(getIntrospectionQuery())).data!))).toMatchInlineSnapshot(`
    "\\"\\"\\"
    Directs the executor to defer this fragment when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @defer(
      \\"\\"\\"Deferred when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String
    ) on FRAGMENT_SPREAD | INLINE_FRAGMENT

    \\"\\"\\"
    Directs the executor to stream plural fields when the \`if\` argument is true or undefined.
    \\"\\"\\"
    directive @stream(
      \\"\\"\\"Stream when true or undefined.\\"\\"\\"
      if: Boolean

      \\"\\"\\"Unique name\\"\\"\\"
      label: String

      \\"\\"\\"Number of items to return immediately\\"\\"\\"
      initialCount: Int = 0
    ) on FIELD

    \\"\\"\\"
    A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.
    \\"\\"\\"
    scalar DateTime

    type Query {
      hello: String!
      users: [User!]!
      stream: [String!]
      context: String!
    }

    type User {
      id: Int!
    }"
  `);
});
